import Keycloak from "keycloak-js";
import { createAppUrls } from "./urls.js";

export const appUrls = createAppUrls(import.meta.env, window.location.origin);

const keycloak = new Keycloak({
  url: appUrls.keycloakUrl,
  realm: appUrls.keycloakRealm,
  clientId: appUrls.keycloakClientId
});

export default keycloak;
