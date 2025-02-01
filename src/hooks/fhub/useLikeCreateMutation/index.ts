import { action } from './action'
import type { Actions } from 'fhub'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

export function useLikeCreateMutation({
  mutation = {},
}: {
  mutation?:
    | UseMutationOptions<
        Actions.Like.create.ReturnType,
        Actions.Like.create.ErrorType,
        Actions.Like.create.ParametersType
      >
    | undefined
} = {}) {
  return useMutation({
    ...mutation,
    mutationKey: ['Like.create'],
    mutationFn: (args) => action(args),
  })
}
