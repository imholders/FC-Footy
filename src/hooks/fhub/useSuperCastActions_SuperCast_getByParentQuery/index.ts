import { action } from './action'
import type { Actions } from 'fhub'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

type QueryKey = [
  'SuperCast.Actions_SuperCast_getByParent',
  Actions.SuperCast.Actions_SuperCast_getByParent.ParametersType | undefined,
]

function queryKey(
  parameters:
    | Actions.SuperCast.Actions_SuperCast_getByParent.ParametersType
    | undefined,
): QueryKey {
  return ['SuperCast.Actions_SuperCast_getByParent', parameters] as const
}

export function useSuperCastActions_SuperCast_getByParentQuery({
  query = {},
  args,
}: {
  query?:
    | Omit<
        UseQueryOptions<
          Actions.SuperCast.Actions_SuperCast_getByParent.ReturnType,
          Actions.SuperCast.Actions_SuperCast_getByParent.ErrorType,
          Actions.SuperCast.Actions_SuperCast_getByParent.ReturnType,
          QueryKey
        >,
        'queryKey'
      >
    | undefined
  args?:
    | Actions.SuperCast.Actions_SuperCast_getByParent.ParametersType
    | undefined
}) {
  const enabled = Boolean(args && (query.enabled ?? true))
  return useQuery({
    ...query,
    queryKey: queryKey(args),
    queryFn: ({ queryKey: [_, args] }) => {
      if (args === undefined) throw new Error('Missing args')
      return action(args)
    },
    enabled,
  })
}
