import { action } from './action'
import type { Actions } from 'fhub'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

export function useUserUpdateMutation({
  mutation = {},
}: {
  mutation?:
    | UseMutationOptions<
        Actions.User.update.ReturnType,
        Actions.User.update.ErrorType,
        Actions.User.update.ParametersType
      >
    | undefined
} = {}) {
  return useMutation({
    ...mutation,
    mutationKey: ['User.update'],
    mutationFn: (args) => action(args),
  })
}
