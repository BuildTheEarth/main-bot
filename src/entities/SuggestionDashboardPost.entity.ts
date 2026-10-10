import typeorm from "typeorm"

@typeorm.Entity({ name: "suggestion_dashboard_posts" })
class SuggestionDashboardPost extends typeorm.BaseEntity {
    @typeorm.PrimaryColumn({ length: 100 })
    key!: string

    @typeorm.Column({ length: 20 })
    messageId!: string
}

export default SuggestionDashboardPost
