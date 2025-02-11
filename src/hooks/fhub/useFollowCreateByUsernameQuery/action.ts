'use server'
import { fhubClient } from '../client'
import { Actions } from 'fhub'

export async function action(
  parameters: Actions.Follow.createByUsername.ParametersType,
): Promise<Actions.Follow.createByUsername.ReturnType> {
  return Actions.Follow.createByUsername(fhubClient, parameters)
}
