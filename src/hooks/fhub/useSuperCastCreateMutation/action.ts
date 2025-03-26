'use server'
import { fhubClient } from '../client'
import * as Actions from 'fhub/Actions'

export async function action(
  parameters: Actions.SuperCast.create.ParametersType,
): Promise<Actions.SuperCast.create.ReturnType> {
  return Actions.SuperCast.create(fhubClient, parameters)
}
