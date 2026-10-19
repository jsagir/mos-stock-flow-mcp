import { handleHealthRequest } from "../dist/server/vercel.js";

export default { fetch: handleHealthRequest };
