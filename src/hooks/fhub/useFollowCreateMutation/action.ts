'use server'
import { fhubClient } from '../client'
import * as Actions from 'fhub/Actions'

export async function action(
  parameters: Actions.Follow.create.ParametersType,
): Promise<Actions.Follow.create.ReturnType> {
  return Actions.Follow.create(fhubClient, parameters)
}
