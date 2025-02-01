import { action } from './action'
import type { Actions } from 'fhub'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

export function useFollowCreateMutation({
  mutation = {},
}: {
  mutation?:
    | UseMutationOptions<
        Actions.Follow.create.ReturnType,
        Actions.Follow.create.ErrorType,
        Actions.Follow.create.ParametersType
      >
    | undefined
} = {}) {
  return useMutation({
    ...mutation,
    mutationKey: ['Follow.create'],
    mutationFn: (args) => action(args),
  })
}
