import { action } from './action'
import type { Actions } from 'fhub'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

export function useCastCreateMutation({
  mutation = {},
}: {
  mutation?:
    | UseMutationOptions<
        Actions.Cast.create.ReturnType,
        Actions.Cast.create.ErrorType,
        Actions.Cast.create.ParametersType
      >
    | undefined
} = {}) {
  return useMutation({
    ...mutation,
    mutationKey: ['Cast.create'],
    mutationFn: (args) => action(args),
  })
}
