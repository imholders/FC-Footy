'use server'
import { fhubClient } from '../client'
import * as Actions from 'fhub/Actions'

export async function action(
  parameters: Actions.Cast.create.ParametersType,
): Promise<Actions.Cast.create.ReturnType> {
  return Actions.Cast.create(fhubClient, parameters)
}
