# Security Specification for Hero Realm Strategy

## Data Invariants
1. A player cannot have negative gold or diamonds.
2. Buildings must belong to the player who owns the parent document.
3. Building slot indices must be within the player's `baseSlots` limit.
4. Troops and Items must be owned by the player whose subcollection they reside in.
5. In a Battle, only the participants (attacker/defender) can update unit positions or HP.

## The Dirty Dozen Payloads (Rejections)
1. Update `gold` to a negative value.
2. Create a building in a slot larger than `baseSlots`.
3. Update another player's `diamonds`.
4. Delete another player's `buildings`.
5. Inject a 1MB string into building `type`.
6. Self-assign `diamonds: 1000000` on profile creation.
7. Change `ownerId` of a building to another user's UID.
8. Battle units updated by a user who isn't the attacker or defender.
9. Change `createdAt` timestamp.
10. Update a battle that has status `concluded`.
11. Update building level to a non-integer.
12. Create a building without a `slotIndex`.

## Tests Verification Plan
- [ ] Profile: Create restricted to UID match.
- [ ] Profile: Diamonds/Gold positive.
- [ ] Buildings: Slot index < baseSlots (relational check via get).
- [ ] Battles: Participants only.
- [ ] Immortality: createdAt immutable.
