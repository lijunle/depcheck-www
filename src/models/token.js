import uuid from 'uuid';
import response from './response';
import { logger, table } from '../services';

function getId(provider, user, repo) {
  return `${provider}:${user}-$KEY$-${repo}`;
}

export function create({ provider, user, repo }) {
  const id = getId(provider, user, repo);
  const token = uuid.v4();

  logger.debug(`[model:token] create token for id [${id}].`);
  return table.insert('token', { id, token, provider, user, repo })
    .then(record => record.token);
}

export function query(filter) {
  logger.debug(`[model:token] query token with filter ${JSON.stringify(filter)}.`);
  return table.query('token', { filter });
}

export function get({ provider, user, repo }) {
  const id = getId(provider, user, repo);

  logger.debug(`[model:token] get token of id [${id}].`);
  return table.query('token', {
    limit: 1,
    filter: { id },
  })
  .then(([record]) => {
    if (!record) {
      const name = `${provider}/${user}/${repo}`;
      logger.info(`[model:token] the repository [${name}] is not enabled.`);
      throw response(400, `Depcheck for repository [${name}] is not enabled.`);
    }

    return record.token;
  });
}

export function validate({ provider, user, repo, token }) {
  logger.debug(`[model:token] validate token of id [${getId(provider, user, repo)}].`);
  return get({ provider, user, repo })
  .then(expected => {
    if (expected !== token) {
      logger.info(`[model:token] unauthorized, expected token [${expected}], actual token [${token}].`);
      throw response(401, `Token ${token} not matches the repo ${repo} of ${provider}/${user}.`);
    }
  });
}
