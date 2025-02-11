'use server'
import { fhubClient } from '../client'
import { Actions } from 'fhub'

export async function action(
  parameters: Actions.SuperCast.getByParent.ParametersType,
): Promise<Actions.SuperCast.getByParent.ReturnType> {
  return Actions.SuperCast.getByParent(fhubClient, parameters)
}
