'use server'
import { fhubClient } from '../client'
import * as Actions from 'fhub/Actions'

export async function action(
  parameters: Actions.Follow.createByUsername.ParametersType,
): Promise<Actions.Follow.createByUsername.ReturnType> {
  return Actions.Follow.createByUsername(fhubClient, parameters)
}
