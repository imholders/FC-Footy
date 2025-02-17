'use server'
import { fhubClient } from '../client'
import * as Actions from 'fhub/Actions'

export async function action(
  parameters: Actions.SuperCast.getByParent.ParametersType,
): Promise<Actions.SuperCast.getByParent.ReturnType> {
  return Actions.SuperCast.getByParent(fhubClient, parameters)
}
