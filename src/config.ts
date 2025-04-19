import 'dotenv/config';

export const CONFIG = {
  TOKEN: process.env.TOKEN!,
  APP_ID: process.env.APP_ID!,
  DEV_ID: process.env.DEV_ID!,
  GUILD_ID: process.env.GUILD_ID!,
  MUTED_ROLE: 'muted'
};

export const ROLES = {
  vegan: 'vegan',
  goingVegan: 'going vegan',
  notVeganYet: 'not vegan (yet)',
  verifier: 'verifier'
};
