Hooks.on("ready", () => {
  console.log("Action Tracker Module is Ready");
});

Hooks.on("updateCombat", (combat, update, options, userId) => {
  const currentCombatant = combat.combatant;
  
  // Check if this is a new turn
  if (update.turn !== undefined) {
    // Reset action counter at the beginning of a new turn
    currentCombatant.actor.setFlag("action-limiter", "actionsUsed", 0);
    
    // Handle effect durations at the end of the current combatant's turn
    decrementEffects(currentCombatant.actor);
  }
});

Hooks.on("preUpdateActor", (actor, update, options, userId) => {
  const combat = game.combat;
  
  // Ensure we're in combat and it's the actor's turn
  if (combat && combat.combatant && combat.combatant.actor.id === actor.id) {
    let actionsUsed = actor.getFlag("action-limiter", "actionsUsed") || 0;

    // Check if an action is being performed
    if (update.hasOwnProperty("data")) {
      if (actionsUsed >= 3) {
        ui.notifications.error(game.i18n.localize("ACTION_LIMIT_REACHED"));
        return false; // Block action if action limit is reached
      }

      // Increment action counter
      actionsUsed++;
      actor.setFlag("action-limiter", "actionsUsed", actionsUsed);
    }
  }
});

/**
 * Decrease the duration of all effects on the actor by 1 round.
 * Remove effects that have no remaining duration.
 * 
 * @param {Actor} actor - The actor whose effects are being modified
 */
function decrementEffects(actor) {
  const effects = actor.effects.entries();

  for (let effect of effects) {
    let remainingDuration = effect.duration.remaining;

    if (remainingDuration !== undefined && remainingDuration > 0) {
      // Decrease the remaining duration by 1
      remainingDuration--;

      // Update the effect with the new duration
      effect.update({ "duration.remaining": remainingDuration });

      // Remove the effect if the duration is 0
      if (remainingDuration === 0) {
        actor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
        ui.notifications.info(`Effect ${effect.data.label} has ended for ${actor.name}`);
      }
    }
  }
}
