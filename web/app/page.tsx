import FlagApp from "./flags-app";
import {requireChatGPTUser} from "./chatgpt-auth";
export const dynamic="force-dynamic";
export default async function Page(){await requireChatGPTUser("/");return <FlagApp/>}
