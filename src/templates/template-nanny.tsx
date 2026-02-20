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

    return (
        <div className="nanny-poster">
            {/* 顶部区域：背景和人物信息 */}
            <div className="nanny-top-section">
                {/* Logo区 */}
                <div className="nanny-logo-header">
                    <img src={logoImg} alt="ONLY YOU Logo" className="nanny-logo" />
                </div>

                <div className="nanny-header">
                    <h1 className="nanny-main-title">{city}{title}</h1>
                    <div className="nanny-subtitle">
                        <span className="nanny-divider">|</span>
                        <span className="nanny-name">{name}</span>
                    </div>
                </div>

                <div className="nanny-body-wrapper">
                    <div className="nanny-left-col">
                        {tags.length > 0 && (
                            <ul className="nanny-tags-list">
                                {tags.map((tag, i) => (
                                    <li key={i} className="nanny-tag-item">● {tag}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="nanny-right-col">
                        {photo ? (
                            <img src={photo} alt="员工照片" className="nanny-photo-cutout" />
                        ) : (
                            <div className="nanny-photo-placeholder-cutout">
                                <span>📷</span>
                                <span>上传照片(透明底最佳)</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 底部信息卡片 */}
            <div className="nanny-bottom-card-wrapper">
                <div className="nanny-info-card">
                    {salary && (
                        <div className="nanny-salary-ribbon">
                            <span className="nanny-ribbon-tail-left"></span>
                            <span className="nanny-salary-text">{salary}</span>
                            <span className="nanny-ribbon-tail-right"></span>
                        </div>
                    )}

                    {highlights.length > 0 && (
                        <ul className="nanny-highlights-list">
                            {highlights.map((h, i) => (
                                <li key={i} className="nanny-highlight-row">
                                    <span className="nanny-highlight-bullet">●</span>
                                    <span>{h}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
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
    width: 900,
    height: 1334,
    component: NannyTemplate,
}
