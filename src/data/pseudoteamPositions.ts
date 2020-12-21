import Roles from "../util/roles"

export default {
    expansions: {
        bto: Roles.TEAM_OWNER,
        vcc: Roles.VERIFIED_CONTENT_CREATOR,
        vs: Roles.VERIFIED_STREAMER
    },

    leads: {
        bto: Roles.REGIONAL_BUILD_TEAM_LEAD,
        vcc: Roles.PR_SUBTEAM_LEADS,
        vs: Roles.PR_SUBTEAM_LEADS
    }
}
