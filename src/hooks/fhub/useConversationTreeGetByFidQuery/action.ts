'use server'
import { fhubClient } from '../client'
import { Actions } from 'fhub'

export async function action(
  parameters: Actions.ConversationTree.getByFid.ParametersType,
): Promise<Actions.ConversationTree.getByFid.ReturnType> {
  return Actions.ConversationTree.getByFid(fhubClient, parameters)
}
