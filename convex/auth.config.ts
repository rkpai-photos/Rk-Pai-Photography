export default {
  providers: [
    {
      // Convex sets CONVEX_SITE_URL automatically on every deployment.
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
