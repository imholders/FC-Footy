'use server'
import { fhubClient } from '../client'
import * as Actions from 'fhub/Actions'

export async function action(
  parameters: Actions.ConversationTree.getByFid.ParametersType,
): Promise<Actions.ConversationTree.getByFid.ReturnType> {
  return Actions.ConversationTree.getByFid(fhubClient, parameters)
}
