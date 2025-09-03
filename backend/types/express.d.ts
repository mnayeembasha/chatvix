import { SafeUser } from "../models/User";

declare global{
    namespace Express{
        interface Request{
            user?:SafeUser
        }
    }
}