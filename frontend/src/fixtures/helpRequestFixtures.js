const helpRequestFixtures = {
  oneHelpRequest: [
    {
      id: 1,
      requesterEmail: "cgaucho@ucsb.edu",
      teamId: "s22-5pm-3",
      tableOrBreakoutRoom: "7",
      requestTime: "2022-04-20T17:35:00",
      explanation: "Need help with Swagger-ui",
      solved: false,
    },
  ],

  threeHelpRequests: [
    {
      id: 1,
      requesterEmail: "cgaucho@ucsb.edu",
      teamId: "s22-5pm-3",
      tableOrBreakoutRoom: "7",
      requestTime: "2022-04-20T17:35:00",
      explanation: "Need help with Swagger-ui",
      solved: false,
    },
    {
      id: 2,
      requesterEmail: "ldelplaya@ucsb.edu",
      teamId: "s22-6pm-4",
      tableOrBreakoutRoom: "11",
      requestTime: "2022-04-20T18:31:00",
      explanation: "Dokku deployment is failing",
      solved: false,
    },
    {
      id: 3,
      requesterEmail: "alovelace@ucsb.edu",
      teamId: "s22-6pm-1",
      tableOrBreakoutRoom: "5",
      requestTime: "2022-04-21T18:15:00",
      explanation: "Merge conflict on main",
      solved: true,
    },
  ],
};

export { helpRequestFixtures };
