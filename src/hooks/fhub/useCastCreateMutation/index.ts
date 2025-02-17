import { action } from './action'
import * as Actions from 'fhub/Actions'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

export function useCastCreateMutation({
  mutation = {},
}: {
  mutation?:
    | UseMutationOptions<
        Actions.Cast.create.ReturnType,
        Actions.Cast.create.ErrorType,
        Exclude<Actions.Cast.create.ParametersType, { message: unknown }>
      >
    | undefined
} = {}) {
  return useMutation({
    ...mutation,
    mutationKey: ['Cast.create'],
    mutationFn: async (args) => {
      const message = await Actions.Cast.createPreconstruct(args)
      return action({ message })
    },
  })
}
