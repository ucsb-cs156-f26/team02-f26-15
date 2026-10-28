const menuItemReviewFixtures = {
  oneMenuItemReview: {
    id: 1,
    itemId: 7,
    reviewerEmail: "first@example.com",
    stars: 5,
    dateReviewed: "2026-10-20T18:00:00",
    comments: "Fresh and tasty",
  },

  threeMenuItemReviews: [
    {
      id: 1,
      itemId: 7,
      reviewerEmail: "first@example.com",
      stars: 5,
      dateReviewed: "2026-10-20T18:00:00",
      comments: "Fresh and tasty",
    },
    {
      id: 2,
      itemId: 7,
      reviewerEmail: "second@example.com",
      stars: 3,
      dateReviewed: "2026-10-21T12:30:00",
      comments: "Good flavor, but served cold",
    },
    {
      id: 3,
      itemId: 12,
      reviewerEmail: "third@example.com",
      stars: 0,
      dateReviewed: "2026-10-22T19:00:00",
      comments: "Would choose something else",
    },
  ],
};

export { menuItemReviewFixtures };
