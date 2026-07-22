import Portal from './Portal.js';
import Interactable from './Interactable.js';

// `sign` is an interactable with a clearer content-facing name. Games can assign
// message and prompt directly in its spec, or override pgeOnInteract for richer UI.
export const BASE_ENTITY_TYPES = { portal: Portal, interactable: Interactable, sign: Interactable };
