export const RouteName = {
  Home: "home",
  Login: "login",
  CreateFirstCompany: "create-first-company",
} as const;

export type RouteName = (typeof RouteName)[keyof typeof RouteName];
