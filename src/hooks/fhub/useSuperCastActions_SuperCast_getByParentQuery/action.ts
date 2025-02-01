'use server'
import { fhubClient } from '../client'
import { Actions } from 'fhub'

export async function action(
  parameters: Actions.SuperCast.Actions_SuperCast_getByParent.ParametersType,
): Promise<Actions.SuperCast.Actions_SuperCast_getByParent.ReturnType> {
  return Actions.SuperCast.Actions_SuperCast_getByParent(fhubClient, parameters)
}
