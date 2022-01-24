import { Actor } from "bdsx/bds/actor";
import {
    ActorWildcardCommandSelector,
    CommandPermissionLevel,
} from "bdsx/bds/command";
import { command } from "bdsx/command";
import { Event } from "bdsx/eventtarget";
import { CxxString } from "bdsx/nativetype";
import { CmdUtil } from "./command";
import { IntervalUtil } from "./interval";

export const FETCH_COMMAND = "fetchentities";
export class EntitiesDetectedEvent {
    static Entries: Record</**identifier */ string, /**selectors */ string> =
        {};
    static New(identifier: string, selectors: string) {
        this.Entries[identifier] = selectors;
    }
    constructor(public identifier: string, public entities: Actor[]) {}
}
IntervalUtil.New(() => {
    for (const id of Object.keys(EntitiesDetectedEvent.Entries)) {
        const selector = EntitiesDetectedEvent.Entries[id];
        CmdUtil.run(`${FETCH_COMMAND} ${id} ${selector}`);
    }
}, 200);
export const onEntitiesDetected = new Event<
    (event: EntitiesDetectedEvent) => void
>();
command
    .register(FETCH_COMMAND, FETCH_COMMAND, CommandPermissionLevel.Host)
    .overload(
        (p, o, op) => {
            const entities = p.entities.newResults(o);
            if (entities.length === 0) return;
            onEntitiesDetected.fire(
                new EntitiesDetectedEvent(p.identifier, entities)
            );
        },
        {
            identifier: CxxString,
            entities: ActorWildcardCommandSelector,
        }
    );
