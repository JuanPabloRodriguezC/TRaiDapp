import { AgentConfig } from "./agent";

export interface PrepData {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
  agentConfig: AgentConfig;
}