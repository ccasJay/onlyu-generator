use std::path::{Path, PathBuf};

use base64::{engine::general_purpose::STANDARD, Engine as _};

fn write_atomic(target: &Path, bytes: &[u8]) -> Result<(), String> {
    let parent = target
        .parent()
        .ok_or_else(|| "保存路径无效".to_string())?;
    let file_name = target
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "保存文件名无效".to_string())?;

    let temp = parent.join(format!(".{file_name}.{}.tmp", std::process::id()));
    std::fs::write(&temp, bytes).map_err(|error| format!("写入临时文件失败：{error}"))?;

    if let Err(error) = std::fs::rename(&temp, target) {
        let _ = std::fs::remove_file(&temp);
        return Err(format!("保存文件失败：{error}"));
    }

    Ok(())
}

#[tauri::command]
fn save_png(path: String, base64_data: String) -> Result<(), String> {
    let bytes = STANDARD
        .decode(base64_data)
        .map_err(|_| "导出图片数据无效".to_string())?;

    if bytes.is_empty() {
        return Err("导出图片数据为空".to_string());
    }

    let target = PathBuf::from(path);
    let is_png = target
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.eq_ignore_ascii_case("png"))
        .unwrap_or(false);

    if !is_png {
        return Err("仅支持保存 PNG 文件".to_string());
    }

    write_atomic(&target, &bytes)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_png])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::write_atomic;

    #[test]
    fn writes_atomically_and_replaces_existing_file() {
        let directory = std::env::temp_dir().join(format!(
            "onlyu-generator-test-{}",
            std::process::id()
        ));
        std::fs::create_dir_all(&directory).expect("create temp directory");
        let target = directory.join("poster.png");

        write_atomic(&target, b"first").expect("initial write");
        assert_eq!(std::fs::read(&target).unwrap(), b"first");

        write_atomic(&target, b"second").expect("replacement write");
        assert_eq!(std::fs::read(&target).unwrap(), b"second");

        std::fs::remove_dir_all(&directory).expect("cleanup temp directory");
    }
}
