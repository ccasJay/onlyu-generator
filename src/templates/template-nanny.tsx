import type { PosterTemplate, TemplateProps } from './types'
import type { FieldDefinition } from './types'
import logoImg from '../assets/logo.jpg'
import './template-nanny.css'

/** 家政/育婴师模板字段定义 */
const nannyFields: FieldDefinition[] = [
    {
        key: 'photo',
        label: '📷 上传阿姨照片',
        type: 'image',
        required: true,
    },
    {
        key: 'city',
        label: '城市',
        type: 'text',
        placeholder: '例如：上海',
        defaultValue: '上海',
    },
    {
        key: 'title',
        label: '主标题（职位）',
        type: 'text',
        placeholder: '例如：育婴师',
        defaultValue: '育婴师',
    },
    {
        key: 'name',
        label: '阿姨姓名',
        type: 'text',
        placeholder: '例如：刘阿姨',
        required: true,
    },
    {
        key: 'salary',
        label: '薪资说明',
        type: 'text',
        placeholder: '例如：8500元+/26天',
    },
    {
        key: 'tags',
        label: '个人标签（逗号分隔）',
        type: 'tags',
        placeholder: '例如：39岁, 上海人, 育婴师',
    },
    {
        key: 'highlights',
        label: '✨ 亮点文案',
        type: 'highlights',
        placeholder: '例如：310上海本地阿姨，丰富带宝经验',
    },
    {
        key: 'employeeId',
        label: '编号',
        type: 'text',
        placeholder: '例如：YX.2399461',
    },
]

/** 家政模板渲染组件 */
const NannyTemplate: React.FC<TemplateProps> = ({ data }) => {
    const city = (data.city as string) || '上海'
    const title = (data.title as string) || '育婴师'
    const name = (data.name as string) || '姓名'
    const salary = (data.salary as string) || ''
    const tags = (data.tags as string[]) || []
    const highlights = (data.highlights as string[]) || []
    const photo = data.photo as string | null
    const employeeId = (data.employeeId as string) || ''

    return (
        <div className="nanny-poster">
            {/* 顶部区域：粉红色背景 */}
            <div className="nanny-top">
                {/* Logo */}
                <div className="nanny-logo-wrapper">
                    <img src={logoImg} alt="ONLY YOU Logo" className="nanny-logo" />
                </div>

                {/* 城市+职位标题 */}
                <h1 className="nanny-city">{city}</h1>
                <h2 className="nanny-title">{title}</h2>

                {/* 员工照片 */}
                <div className="nanny-photo-wrapper">
                    {photo ? (
                        <img src={photo} alt="员工照片" className="nanny-photo" />
                    ) : (
                        <div className="nanny-photo-placeholder">
                            <span>📷</span>
                            <span>上传照片</span>
                        </div>
                    )}
                </div>

                {/* 姓名 */}
                <div className="nanny-name">
                    <span className="nanny-name-bar"></span>
                    <span className="nanny-name-text">{name}</span>
                </div>

                {/* 标签 */}
                {tags.length > 0 && (
                    <ul className="nanny-tags">
                        {tags.map((tag, i) => (
                            <li key={i} className="nanny-tag">• {tag}</li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 底部区域：白色背景 */}
            <div className="nanny-bottom">
                {/* 薪资标签 */}
                {salary && (
                    <div className="nanny-salary-badge">
                        <span>{salary}</span>
                    </div>
                )}

                {/* 亮点文案 */}
                {highlights.length > 0 && (
                    <ul className="nanny-highlights">
                        {highlights.map((h, i) => (
                            <li key={i} className="nanny-highlight-item">
                                <span className="nanny-highlight-dot"></span>
                                <span>{h}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* 底部编号 */}
                {employeeId && (
                    <div className="nanny-footer">
                        <span>编号{employeeId}</span>
                        <span className="nanny-footer-arrow">→</span>
                    </div>
                )}
            </div>
        </div>
    )
}

/** 家政/育婴师模板 */
export const nannyTemplate: PosterTemplate = {
    id: 'nanny',
    name: '家政员工推荐',
    description: '适用于育婴师、保姆、月嫂等家政员工推荐海报',
    fields: nannyFields,
    width: 750,
    height: 1334,
    component: NannyTemplate,
}
