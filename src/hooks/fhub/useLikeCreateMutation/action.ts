'use server'
import { fhubClient } from '../client'
import { Actions } from 'fhub'

export async function action(
  parameters: Actions.Like.create.ParametersType,
): Promise<Actions.Like.create.ReturnType> {
  return Actions.Like.create(fhubClient, parameters)
}
