// Short names for generated schema types. Add aliases here as features need them.
import type { components } from "./schema";

type Schemas = components["schemas"];

export type MeOut = Schemas["MeOut"];
export type UserOut = Schemas["UserOut"];
export type UserRegister = Schemas["UserRegister"];
export type TokenOut = Schemas["TokenOut"];
export type SystemRole = Schemas["SystemRole"];
export type OrganizerProfileIn = Schemas["OrganizerProfileIn"];
export type OrganizerProfileOut = Schemas["OrganizerProfileOut"];
export type LoginForm = Schemas["Body_login_auth_login_post"];
