const recommendationRequestFixtures = {
    oneRecommendationRequest: {
        id: 1,
        requesterEmail: "cgaucho@ucsb.edu",
        professorEmail: "phtcon@ucsb.edu",
        explanation: "BS/MS program",
        dateRequested: "2022-04-20T00:00:00",
        dateNeeded: "2022-05-01T00:00:00",
        done: false,
    },
    threeRecommendationRequests: [
        {
            id: 1,
            requesterEmail: "cgaucho@ucsb.edu",
            professorEmail: "phtcon@ucsb.edu",
            explanation: "BS/MS program",
            dateRequested: "2022-04-20T00:00:00",
            dateNeeded: "2022-05-01T00:00:00",
            done: false,
        },
        {
            id: 2,
            requesterEmail: "ldelplaya@ucsb.edu",
            professorEmail: "richert@ucsb.edu",
            explanation: "PhD CS Stanford",
            dateRequested: "2022-05-20T00:00:00",
            dateNeeded: "2022-11-15T00:00:00",
            done: false,
        },
        {
            id: 3,
            requesterEmail: "alu@ucsb.edu",
            professorEmail: "phtcon@ucsb.edu",
            explanation: "PhD CE Cal Tech",
            dateRequested: "2022-05-20T00:00:00",
            dateNeeded: "2022-11-15T00:00:00",
            done: true,
        },
    ],
};

export { recommendationRequestFixtures };