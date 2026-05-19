import { config } from 'dotenv';

config({ path: '.env' });

export const getRequiredEnv = (name: string) => {
  const value = process.env[name];

  if (value === undefined) {
    throw new Error(`${name} is not defined`);
  }

  return value;
};
