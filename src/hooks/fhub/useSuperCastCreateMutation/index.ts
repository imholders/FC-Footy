import { action } from './action'
import type { Actions } from 'fhub'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

export function useSuperCastCreateMutation({
  mutation = {},
}: {
  mutation?:
    | UseMutationOptions<
        Actions.SuperCast.create.ReturnType,
        Actions.SuperCast.create.ErrorType,
        Actions.SuperCast.create.ParametersType
      >
    | undefined
} = {}) {
  return useMutation({
    ...mutation,
    mutationKey: ['SuperCast.create'],
    mutationFn: (args) => action(args),
  })
}
