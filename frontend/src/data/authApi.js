import { currentUser } from './mockData.js'

const pause = () => new Promise((resolve) => window.setTimeout(resolve, 350))

function initialsFor(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'U'
}

export async function demoLogin({ email }) {
  await pause()
  const localPart = email.split('@')[0] || currentUser.name
  const name = localPart.replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  return { ...currentUser, name, initials: initialsFor(name), email }
}

export async function demoSignUp({ name, workspace, email }) {
  await pause()
  return {
    ...currentUser,
    name: name.trim(),
    initials: initialsFor(name),
    email: email.trim(),
    workspace: workspace.trim(),
    team: 'Supply Chain Operations',
    title: 'Workspace administrator',
    accessLevel: 'Workspace administrator',
  }
}
