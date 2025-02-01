import { action } from './action'
import type { Actions } from 'fhub'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

export function useRecastCreateMutation({
  mutation = {},
}: {
  mutation?:
    | UseMutationOptions<
        Actions.Recast.create.ReturnType,
        Actions.Recast.create.ErrorType,
        Actions.Recast.create.ParametersType
      >
    | undefined
} = {}) {
  return useMutation({
    ...mutation,
    mutationKey: ['Recast.create'],
    mutationFn: (args) => action(args),
  })
}
