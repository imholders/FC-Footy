'use server'
import { fhubClient } from '../client'
import * as Actions from 'fhub/Actions'

export async function action(
  parameters: Actions.Cast.toString.ParametersType,
): Promise<Actions.Cast.toString.ReturnType> {
  return Actions.Cast.toString(fhubClient, parameters)
}
