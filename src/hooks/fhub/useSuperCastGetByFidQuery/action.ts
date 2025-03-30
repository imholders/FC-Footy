'use server'
import { fhubClient } from '../client'
import * as Actions from 'fhub/Actions'

export async function action(
  parameters: Actions.SuperCast.getByFid.ParametersType,
): Promise<Actions.SuperCast.getByFid.ReturnType> {
  return Actions.SuperCast.getByFid(fhubClient, parameters)
}
