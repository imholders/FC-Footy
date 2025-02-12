'use server'
import { fhubClient } from '../client'
import * as Actions from 'fhub/Actions'

export async function action(
  parameters: Actions.User.update.ParametersType,
): Promise<Actions.User.update.ReturnType> {
  return Actions.User.update(fhubClient, parameters)
}
