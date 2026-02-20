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
            {/* 顶部金色装饰横线 */}
            <div className="nanny-deco-stripe" />

            {/* 顶部区域：标题 + 标签 + 人物 */}
            <div className="nanny-top-section">
                {/* Logo 右上角 */}
                <div className="nanny-logo-header">
                    <img src={logoImg} alt="ONLY YOU Logo" className="nanny-logo" />
                </div>

                {/* 主标题 */}
                <div className="nanny-header">
                    <h1 className="nanny-main-title">{city}{title}</h1>
                    <div className="nanny-subtitle">
                        {/* 金色竖线分隔符 */}
                        <span className="nanny-divider" />
                        <span className="nanny-name">{name}</span>
                    </div>
                </div>

                <div className="nanny-body-wrapper">
                    {/* 左列：个人标签 */}
                    <div className="nanny-left-col">
                        {tags.length > 0 && (
                            <ul className="nanny-tags-list">
                                {tags.map((tag, i) => (
                                    <li key={i} className="nanny-tag-item">{tag}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* 右列：人物照片 */}
                    <div className="nanny-right-col">
                        {photo ? (
                            <img src={photo} alt="员工照片" className="nanny-photo-cutout" />
                        ) : (
                            <div className="nanny-photo-placeholder-cutout">
                                <span className="ph-icon">📷</span>
                                <span className="ph-text">上传照片<br />透明底最佳</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 底部信息卡片 */}
            <div className="nanny-bottom-card-wrapper">
                <div className="nanny-info-card">
                    {/* 金色薪资丝带 */}
                    {salary && (
                        <div className="nanny-salary-ribbon">
                            <span className="nanny-salary-text">{salary}</span>
                        </div>
                    )}

                    {/* 亮点文案列表（数字序号） */}
                    {highlights.length > 0 && (
                        <ul className="nanny-highlights-list">
                            {highlights.map((h, i) => (
                                <li key={i} className="nanny-highlight-row">
                                    <span className="nanny-highlight-bullet" />
                                    <span>{h}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* 底部品牌装饰线 */}
                    <div className="nanny-brand-footer">
                        <span className="nanny-brand-footer-line" />
                        <span className="nanny-brand-footer-text">欧利优家政服务</span>
                        <span className="nanny-brand-footer-line" />
                    </div>
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
