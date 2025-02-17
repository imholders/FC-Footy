'use server'
import { fhubClient } from '../client'
import * as Actions from 'fhub/Actions'

export async function action(
  parameters: Actions.Cast.fromString.ParametersType,
): Promise<Actions.Cast.fromString.ReturnType> {
  return Actions.Cast.fromString(fhubClient, parameters)
}
