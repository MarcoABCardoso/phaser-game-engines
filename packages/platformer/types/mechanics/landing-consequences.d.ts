/** Install game-defined consequences for the scene's schema-free landing facts. */
export declare function createLandingConsequenceMechanic({ resolve, apply }?: {
    resolve?: ((fact: any) => any) | undefined;
}): (scene: any) => any;
