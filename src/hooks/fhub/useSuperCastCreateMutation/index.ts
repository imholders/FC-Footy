import { action } from './action'
import * as Actions from 'fhub/Actions'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

export function useSuperCastCreateMutation({
  mutation = {},
}: {
  mutation?:
    | UseMutationOptions<
        Actions.SuperCast.create.ReturnType,
        Actions.SuperCast.create.ErrorType,
        Exclude<Actions.SuperCast.create.ParametersType, { message: unknown }>
      >
    | undefined
} = {}) {
  return useMutation({
    ...mutation,
    mutationKey: ['SuperCast.create'],
    mutationFn: async (args) => {
      const message = await Actions.SuperCast.createPreconstruct(args)
      return action({ message })
    },
  })
}
