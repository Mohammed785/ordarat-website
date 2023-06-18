import { LoadStrategy, Options } from "@mikro-orm/core";
import {User} from "./models/User";

const options:Options = {
    entities:[User],
    dbName:"data.db",
    type:"sqlite",
    debug:true,
    loadStrategy:LoadStrategy.JOINED
}

export default options