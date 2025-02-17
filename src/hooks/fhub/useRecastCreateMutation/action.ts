'use server'
import { fhubClient } from '../client'
import * as Actions from 'fhub/Actions'

export async function action(
  parameters: Actions.Recast.create.ParametersType,
): Promise<Actions.Recast.create.ReturnType> {
  return Actions.Recast.create(fhubClient, parameters)
}
