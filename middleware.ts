import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/((?!_next|api|favicon\\.ico|icon-.*\\.png|apple-icon\\.png|images|fonts|.*\\..*).*)",
  ],
};
